import { TestValidator } from "@nestia/e2e";

import { physicalBalanceExhaustion } from "../../../../packages/engine/src/physics/physicalBalanceExhaustion";
import { physicalTrackingWithdrawn } from "../../../../packages/engine/src/physics/physicalTrackingWithdrawn";

/** Exhausted support recovery withdraws default tracking, while explicit joint protection keeps its own effort.
 *
 * Scenarios:
 * 1. The first unrecoverable tick opens the loss clock; later unrecoverable ticks keep its start.
 * 2. Recovery is exhausted exactly when the clock reaches the policy duration, not one tick earlier.
 * 3. A recoverable tick closes the clock, and a failed landing exhausts at once.
 * 4. Zero effective strength withdraws tracking; a positive explicit joint strength keeps it, a zero one does not.
 * 5. Any positive body strength keeps tracking.
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
