import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** The carried duration, seconds. */
const D: number = 0.4;

/** Rounding of the quintic's few products, seconds squared. */
const ROUNDING: number = 1e-12;

/** The difference step for the derivatives, seconds. */
const H: number = 1e-6;

/**
 * `carriedAcceleration` is the quintic Hermite basis of a unit initial
 * acceleration over a duration `D`: `D^2 u^2 (1 - u)^3 / 2` with `u = elapsed /
 * D` clamped into [0, 1], zero value and slope and unit acceleration at the
 * start, zero value, slope and acceleration at the end.
 *
 * Scenarios:
 *
 * 1. Interior values at a fifth, a half and four fifths of the duration follow the
 *    documented form.
 * 2. The term is zero at both ends and outside them.
 * 3. Its peak is `PEAK = 54 / 3125` squared durations at two fifths of the
 *    duration, higher than its neighbours a hundredth away.
 * 4. Near the cut `2 f(h) / h^2` is the initial acceleration, 1 to within `3 h /
 *    D`, and `f(h) / h` the initial slope, 0 to within `h / 2`.
 * 5. A duration of 0 or less is refused.
 */
export function test_engine_motion_carried_acceleration(): void {
  // 1. The interior.
  for (const u of [1 / 5, 1 / 2, 4 / 5])
    TestValidator.predicate(
      `interior at ${u}`,
      nclose(
        AutoMovieEngineMotionSampling.carriedAcceleration(D, u * D),
        (D * D * u * u * (1 - u) ** 3) / 2,
        ROUNDING,
      ),
    );

  // 2. Zero at the ends and outside.
  for (const elapsed of [-D, 0, D, 2 * D])
    TestValidator.predicate(
      `zero at ${elapsed} s`,
      nclose(AutoMovieEngineMotionSampling.carriedAcceleration(D, elapsed), 0, ROUNDING),
    );

  // 3. The peak.
  const peak: number = AutoMovieEngineMotionSampling.carriedAcceleration(D, (2 * D) / 5);
  TestValidator.predicate(
    "the peak at two fifths",
    nclose(AutoMovieEngineMotionSampling.carriedAccelerationPeak(), 54 / 3125, 1e-15) &&
      nclose(peak, (D * D * 54) / 3125, ROUNDING) &&
      AutoMovieEngineMotionSampling.carriedAcceleration(D, (2 * D) / 5 - D / 100) < peak &&
      AutoMovieEngineMotionSampling.carriedAcceleration(D, (2 * D) / 5 + D / 100) < peak,
  );

  // 4. The start's acceleration and slope.
  const near: number = AutoMovieEngineMotionSampling.carriedAcceleration(D, H);
  TestValidator.predicate(
    "unit acceleration and zero slope at the cut",
    nclose((2 * near) / (H * H), 1, (4 * H) / D) && nclose(near / H, 0, H),
  );

  // 5. Refusals.
  for (const duration of [0, -1])
    TestValidator.predicate(
      `a duration of ${duration} is refused`,
      throwsError(() => AutoMovieEngineMotionSampling.carriedAcceleration(duration, 0.1)),
    );
}
