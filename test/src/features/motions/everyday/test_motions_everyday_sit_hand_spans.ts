import {
  sitHandSpans
} from "../../../../../packages/motions/src/everyday/internal/sitHandSpans";
import { TestValidator } from "@nestia/e2e";

/**
 * Read how far a sitting hand has reached towards its support.
 *
 * Scenarios:
 * 1. A hand meeting its support at departure is resting at that exact second.
 * 2. Across a positive reach span the endpoints hold. The minimum-jerk
 *    quintic gives 53/512 at one quarter and one half at the midpoint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sitting hand support handles an existing exact-start contact and a later reach into the same phase.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the hand support span reader with assigned departure and arrival times for both cases.
 * @evidence contracts/development/testing.md#independent-expectations An existing contact begins at full share. The timed reach's endpoints and interior share follow the minimum-jerk formula.
 */
export function test_motions_everyday_sit_hand_spans(): void {
  const touching: { start: number; ready: number } = { start: 0, ready: 0 };
  TestValidator.predicate(
    "an existing contact is fully resting at the exact start",
    sitHandSpans.progress(touching, -0.25) === 0 &&
      sitHandSpans.progress(touching, 0) === 1 &&
      sitHandSpans.progress(touching, 0.25) === 1,
  );

  const reaching: { start: number; ready: number } = { start: 1, ready: 3 };
  TestValidator.predicate(
    "a reach holds its endpoints and follows minimum jerk through the middle",
    sitHandSpans.progress(reaching, 0) === 0 &&
      sitHandSpans.progress(reaching, 1) === 0 &&
      sitHandSpans.progress(reaching, 1.5) === 53 / 512 &&
      sitHandSpans.progress(reaching, 2) === 0.5 &&
      sitHandSpans.progress(reaching, 3) === 1 &&
      sitHandSpans.progress(reaching, 4) === 1,
  );
}
