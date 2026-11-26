import { AutoMoviePhysicalBalance, AutoMoviePhysicalTracking } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Exhausted support recovery withdraws default tracking, while an explicit
 * joint strength keeps its own effort.
 *
 * Policy duration: 0.25 s.
 *
 * Scenarios:
 *
 * 1. The first unrecoverable tick at 1 s opens the loss clock at 1.
 * 2. At 1.24 s the clock keeps its start and is not exhausted; at 1.25 s it is.
 * 3. A recoverable tick closes the clock; a failed landing exhausts at once.
 * 4. Tracking is withdrawn at strength 0 (also with a zero explicit joint
 *    strength) and kept with a positive joint strength 1 or a body strength of
 *    1e-9.
 */
export function test_engine_physics_balance_exhaustion(): void {
  const duration: number = 0.25;
  TestValidator.equals(
    "opens",
    AutoMoviePhysicalBalance.exhaustion({ unrecoverable: true, seconds: 1, duration }),
    { lostSince: 1, exhausted: false },
  );
  TestValidator.equals(
    "one tick before",
    AutoMoviePhysicalBalance.exhaustion({
      unrecoverable: true,
      lostSince: 1,
      seconds: 1.24,
      duration,
    }),
    { lostSince: 1, exhausted: false },
  );
  TestValidator.equals(
    "at the duration",
    AutoMoviePhysicalBalance.exhaustion({
      unrecoverable: true,
      lostSince: 1,
      seconds: 1.25,
      duration,
    }),
    { lostSince: 1, exhausted: true },
  );
  TestValidator.equals(
    "recovers",
    AutoMoviePhysicalBalance.exhaustion({
      unrecoverable: false,
      lostSince: 1,
      seconds: 2,
      duration,
    }),
    { lostSince: undefined, exhausted: false },
  );
  TestValidator.equals(
    "failed landing",
    AutoMoviePhysicalBalance.exhaustion({
      unrecoverable: false,
      failedLanding: true,
      seconds: 2,
      duration,
    }),
    { lostSince: undefined, exhausted: true },
  );
  TestValidator.equals(
    "withdrawal",
    [
      AutoMoviePhysicalTracking.withdrawn({ strength: 0 }),
      AutoMoviePhysicalTracking.withdrawn({ strength: 0, jointStrength: { knee: 1 } }),
      AutoMoviePhysicalTracking.withdrawn({ strength: 0, jointStrength: { knee: 0 } }),
      AutoMoviePhysicalTracking.withdrawn({ strength: 1e-9 }),
    ],
    [true, false, true, false],
  );
}
