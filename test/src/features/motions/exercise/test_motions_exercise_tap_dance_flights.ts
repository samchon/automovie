import { AutoMovieEngineGravity } from "@automovie/engine";
import {
  tapDanceFlights
} from "../../../../../packages/motions/src/exercise/internal/tapDanceFlights";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A key bearing from one second to another, or one that does not bear. */
const key = (
  at: number,
  leave: number,
  bears: boolean = true,
): tapDanceFlights.IKey => ({ at, leave, bears });

/**
 * `tapDanceFlights` finds where neither foot bears, and `hop` lifts the hips on
 * each flight's ballistic arc, `4 (g T² / 8) u (1 − u)`.
 *
 * Scenarios, a dance ending at 3 s:
 *
 * 1. The left bears from 0 to 1 s and from 1.4 to 3.5 s, the right from 0.5 to 1.2
 *    s and its brush at 2 s does not bear: the only flight is 1.2 to 1.4 s, the
 *    last span cut at the end.
 * 2. A dance that starts in the air flies from 0 until its first bearing key.
 * 3. In the middle of the 0.2 s flight the hips are `g 0.04 / 8` up; outside it
 *    none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tap dance lifts the hips only where both foot supports are absent. Brushes provide no support.
 * @evidence contracts/development/testing.md#behavioral-verification Calls flight extraction on overlapping bearing spans and a brush, then samples the ballistic hop inside and outside flight.
 * @evidence contracts/development/testing.md#independent-expectations Subtracting the bearing intervals gives the 1.2–1.4 s gap. Its 0.2-second duration and gravity give the midpoint rise independently.
 */
export function test_motions_exercise_tap_dance_flights(): void {
  const flights: tapDanceFlights.IFlight[] = tapDanceFlights(
    {
      left: [key(0, 1), key(1.4, 3.5)],
      right: [key(0.5, 1.2), key(2, 2.1, false)],
    },
    3,
  );
  TestValidator.equals("one flight", flights, [{ from: 1.2, to: 1.4 }]);
  TestValidator.equals(
    "from the start",
    tapDanceFlights({ left: [key(0.3, 1)], right: [] }, 3),
    [{ from: 0, to: 0.3 }],
  );
  TestValidator.predicate(
    "the hop",
    nclose(
      tapDanceFlights.hop(flights, 1.3),
      (AutoMovieEngineGravity.STANDARD * 0.04) / 8,
      1e-12,
    ) &&
      tapDanceFlights.hop(flights, 1) === 0 &&
      tapDanceFlights.hop(flights, 1.4) === 0,
  );
}
