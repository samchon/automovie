import { carriedRate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** The carried duration, seconds. */
const D: number = 0.4;

/** Rounding of the quintic's few products, seconds. */
const ROUNDING: number = 1e-12;

/** The difference step for the slopes, seconds. */
const H: number = 1e-6;

/**
 * `carriedRate` is the quintic Hermite basis of a unit initial velocity over a
 * duration `D`: `D (u - 6 u^3 + 8 u^4 - 3 u^5)` with `u = elapsed / D` clamped
 * into [0, 1], which factors as `D u (1 - u)^3 (1 + 3 u)`, the form the
 * expectations use.
 *
 * Scenarios:
 *
 * 1. Interior values at a fifth, a half and four fifths of the duration follow the
 *    factored form.
 * 2. The term is zero at both ends and outside them.
 * 3. Its peak is `PEAK = 16 / 81` durations at a third of the duration, higher
 *    than its neighbours a hundredth of the duration away.
 * 4. It leaves the cut at unit slope and arrives at zero slope; a one-sided
 *    difference over a microsecond differs from the slope by `6 (h / D)^2` at
 *    the start, far under the tolerance.
 * 5. A duration of 0 or less is refused.
 */
export function test_unit_engine_motion_carried_rate(): void {
  // 1. The factored interior.
  for (const u of [1 / 5, 1 / 2, 4 / 5])
    TestValidator.predicate(
      `interior at ${u}`,
      nclose(
        carriedRate(D, u * D),
        D * u * (1 - u) ** 3 * (1 + 3 * u),
        ROUNDING,
      ),
    );

  // 2. Zero at the ends and outside.
  for (const elapsed of [-D, 0, D, 2 * D])
    TestValidator.predicate(
      `zero at ${elapsed} s`,
      nclose(carriedRate(D, elapsed), 0, ROUNDING),
    );

  // 3. The peak.
  const peak: number = carriedRate(D, D / 3);
  TestValidator.predicate(
    "the peak at a third",
    nclose(carriedRate.PEAK, 16 / 81, 1e-15) &&
      nclose(peak, (D * 16) / 81, ROUNDING) &&
      carriedRate(D, D / 3 - D / 100) < peak &&
      carriedRate(D, D / 3 + D / 100) < peak,
  );

  // 4. The end slopes.
  TestValidator.predicate(
    "unit slope at the cut",
    nclose((carriedRate(D, H) - carriedRate(D, 0)) / H, 1, 1e-9),
  );
  TestValidator.predicate(
    "zero slope at the end",
    nclose((carriedRate(D, D) - carriedRate(D, D - H)) / H, 0, 1e-9),
  );

  // 5. Refusals.
  for (const duration of [0, -1])
    TestValidator.predicate(
      `a duration of ${duration} is refused`,
      throwsError(() => carriedRate(duration, 0.1)),
    );
}
