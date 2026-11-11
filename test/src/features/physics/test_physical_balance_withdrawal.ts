import {
  physicalBalanceExhaustion,
  physicalTrackingWithdrawn,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Exhausted support recovery withdraws default tracking, while explicit joint protection keeps its own effort.
 *
 * Scenarios:
 * 1. The first unrecoverable tick opens the loss clock; later unrecoverable ticks keep its start.
 * 2. Recovery is exhausted exactly when the clock reaches the policy duration, not one tick earlier.
 * 3. A recoverable tick closes the clock, and a failed landing exhausts at once.
 * 4. Zero effective strength withdraws tracking; a positive explicit joint strength keeps it, a zero one does not.
 * 5. Any positive body strength keeps tracking.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `physicalBalanceExhaustion`, `physicalTrackingWithdrawn` on in-memory inputs and asserts the returned observations through 6x TestValidator.equals; 5 numbered scenarios (first: The first unrecoverable tick opens the loss clock; later unrecoverable ticks keep its start.; last: Any positive body strength keeps tracking.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (6 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: The first unrecoverable tick opens the loss clock; later unrecoverable ticks keep its start.; last: Any positive body strength keeps tracking.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_balance_withdrawal`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The first unrecoverable tick opens the loss clock; later unrecoverable ticks keep its start.).
 */
export function test_physical_balance_withdrawal(): void {
  const duration: number = 0.25;
  const opened: ReturnType<typeof physicalBalanceExhaustion> =
    physicalBalanceExhaustion({ unrecoverable: true, seconds: 1, duration });
  TestValidator.equals("loss clock opens", opened, {
    lostSince: 1,
    exhausted: false,
  });
  TestValidator.equals(
    "loss clock keeps its start one tick before the duration",
    physicalBalanceExhaustion({
      unrecoverable: true,
      lostSince: 1,
      seconds: 1.24,
      duration,
    }),
    { lostSince: 1, exhausted: false },
  );
  TestValidator.equals(
    "recovery is exhausted at the duration",
    physicalBalanceExhaustion({
      unrecoverable: true,
      lostSince: 1,
      seconds: 1.25,
      duration,
    }),
    { lostSince: 1, exhausted: true },
  );
  TestValidator.equals(
    "a recoverable tick closes the clock",
    physicalBalanceExhaustion({
      unrecoverable: false,
      lostSince: 1,
      seconds: 2,
      duration,
    }),
    { lostSince: undefined, exhausted: false },
  );
  TestValidator.equals(
    "a failed landing exhausts at once",
    physicalBalanceExhaustion({
      unrecoverable: false,
      failedLanding: true,
      seconds: 2,
      duration,
    }),
    { lostSince: undefined, exhausted: true },
  );
  TestValidator.equals(
    "tracking withdrawal decisions",
    [
      physicalTrackingWithdrawn({ strength: 0 }),
      physicalTrackingWithdrawn({ strength: 0, jointStrength: { knee: 1 } }),
      physicalTrackingWithdrawn({ strength: 0, jointStrength: { knee: 0 } }),
      physicalTrackingWithdrawn({ strength: 1e-9 }),
    ],
    [true, false, true, false],
  );
}
