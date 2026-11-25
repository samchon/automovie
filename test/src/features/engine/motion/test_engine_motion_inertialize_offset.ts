import { inertializeOffset } from "@automovie/engine";
import type { IAutoMovieInertializeOffset } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of the quintic's few products, in the offset's unit. */
const ROUNDING: number = 1e-12;

/**
 * `inertializeOffset` decays a transition offset on Bollo's quintic (GDC 2018):
 * it starts at the offset `x0` with its velocity `v0`, ends at the decay time
 * `t1` with zero value, velocity and acceleration, and, unless passing through
 * is asked for, shortens `t1` to `-5 x0 / v0` for a velocity heading to zero so
 * the offset never crosses it.
 *
 * At half the decay time the quintic is `(3 x0 + v0 t1 / 2) / 16`, worked by
 * hand from `s^4 (b + c s)` at `s = t1 / 2`; a zero offset carried by a rate is
 * the lobe `v0 s^4 t / t1^4`, `256 v0 t1 / 3125` at `t = t1 / 5`. Both are
 * closed forms of the talk, not of the code.
 *
 * Scenarios:
 *
 * 1. An offset of 0.3 moving away at 1.2 per second over 0.5 s: no clamp, the
 *    value and velocity at the cut are `x0` and `v0`, 0.075 at 0.25 s, and zero
 *    value and velocity from 0.5 s on.
 * 2. An offset of 0.01 heading to zero at -24 per second over 0.3 s is clamped to
 *    `0.05 / 24` s and stays on its own side of zero.
 * 3. The same offset passing through runs the whole 0.3 s, crosses zero and
 *    overshoots by no more than the talk's bound, the velocity in excess of `5
 *    |x0| / t1` times `256 t1 / 3125`.
 * 4. A zero offset with a rate of 1 rises to `256 t1 / 3125` at a fifth of the
 *    decay and returns to zero.
 * 5. Before the cut the offset is its value at the cut.
 * 6. A decay time of 0 is refused.
 */
export function test_engine_motion_inertialize_offset(): void {
  // 1. Moving away: the whole decay time.
  const cut: IAutoMovieInertializeOffset.IState = inertializeOffset(
    0.3,
    1.2,
    0.5,
    0,
  );
  TestValidator.predicate(
    "value and velocity continue the cut",
    nclose(cut.value, 0.3, ROUNDING) &&
      nclose(cut.velocity, 1.2, ROUNDING) &&
      cut.duration === 0.5,
  );
  TestValidator.predicate(
    "the quintic at half the decay",
    nclose(inertializeOffset(0.3, 1.2, 0.5, 0.25).value, 0.075, ROUNDING),
  );
  for (const elapsed of [0.5, 0.8])
    TestValidator.equals(
      `settled at ${elapsed} s`,
      inertializeOffset(0.3, 1.2, 0.5, elapsed),
      { value: 0, velocity: 0, duration: 0.5 },
    );

  // 2. Heading to zero: clamped, never crossing.
  const clamp: number = 0.05 / 24;
  const clamped: IAutoMovieInertializeOffset.IState = inertializeOffset(
    0.01,
    -24,
    0.3,
    0,
  );
  TestValidator.predicate(
    "the clamp shortens the decay",
    nclose(clamped.duration, clamp, 1e-15),
  );
  for (const share of [0.1, 0.5, 0.9])
    TestValidator.predicate(
      `the clamped offset stays positive at ${share} of its decay`,
      inertializeOffset(0.01, -24, 0.3, share * clamp).value >= 0,
    );

  // 3. Passing through: bounded overshoot.
  const through: IAutoMovieInertializeOffset.IState = inertializeOffset(
    0.01,
    -24,
    0.3,
    0.06,
    true,
  );
  const bound: number = ((24 - (5 * 0.01) / 0.3) * 256 * 0.3) / 3125;
  TestValidator.predicate(
    "passing through overshoots within the bound",
    through.duration === 0.3 && through.value < 0 && -through.value <= bound,
  );

  // 4. A zero offset carried by a rate.
  TestValidator.predicate(
    "the lobe of a carried rate",
    nclose(
      inertializeOffset(0, 1, 0.3, 0.06).value,
      (256 * 0.3) / 3125,
      ROUNDING,
    ) && inertializeOffset(0, 1, 0.3, 0.3).value === 0,
  );

  // 5. Before the cut.
  TestValidator.predicate(
    "before the cut",
    nclose(inertializeOffset(0.3, 1.2, 0.5, -1).value, 0.3, ROUNDING),
  );

  // 6. No decay time.
  TestValidator.predicate(
    "a decay time of 0 is refused",
    throwsError(() => inertializeOffset(1, 0, 0, 0)),
  );
}
