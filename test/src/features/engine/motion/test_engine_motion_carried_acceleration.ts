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
 * 4. Near the cut, `2 f(h) / h^2` approximates the initial acceleration of 1
 *    within `4 h / D`. The quotient `f(h) / h` approximates zero slope within `h`.
 * 5. A duration of 0 or less is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the unit-acceleration basis, its interior and out-of-window values, the peak, its initial derivative behavior, and invalid duration.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `carriedAcceleration` and its peak helper directly for three interior fractions, four samples at or beyond the endpoints, two near-peak neighbors, and non-positive durations.
 * @evidence contracts/development/testing.md#independent-expectations The quintic with unit initial acceleration and zero endpoint displacement and slopes is D²u²(1 - u)³/2. Its maximum at u = 2/5 is 54D²/3125. At a small elapsed time h the computed ratios approach 1 for twice the displacement over h² and 0 for displacement over h.
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
