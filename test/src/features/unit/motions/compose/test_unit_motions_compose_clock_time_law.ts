import type { IAutoMovieMotionClock } from "@automovie/interface";
import { AutoMovieMotionClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A prepared interval clamps action-local time and eases progress with the
 * minimum-jerk polynomial.
 *
 * Scenarios:
 *
 * 1. Query the same interval before, after and inside its window in
 *    nonchronological order.
 * 2. Check analytic progress velocity at an interior point and the constant
 *    exterior.
 * 3. Equal endpoints switch to the closed state at their shared instant.
 */
export function test_unit_motions_compose_clock_time_law(): void {
  const open: number = 2;
  const close: number = 6;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(8, [
    { name: "open", seconds: open },
    { name: "close", seconds: close },
  ]);
  const window = AutoMovieMotionClock.prepare(clock, "open", "close");
  for (const t of [5, 1, 6, 3, 4, 8, 2, 3]) {
    const u: number = Math.min(1, Math.max(0, (t - open) / (close - open)));
    const progress: number = u ** 3 * (10 - 15 * u + 6 * u * u);
    TestValidator.predicate(
      "clamped linear and minimum-jerk progress at " + t,
      nclose(window.linear(t), u, 1e-12) &&
        nclose(window.progress(t), progress, 1e-12),
    );
    if (t === open || t === close) continue;
    const step: number = (close - open) * 1e-5;
    const slope: number =
      (window.progress(t + step) - window.progress(t - step)) / (2 * step);
    TestValidator.predicate(
      "minimum-jerk velocity at " + t,
      nclose(slope, (30 * u * u * (1 - u) ** 2) / (close - open), 1e-8),
    );
  }
  const point = AutoMovieMotionClock.prepare(clock, "open", "open");
  TestValidator.equals(
    "zero interval closes on its instant",
    [point.linear(open - 1), point.linear(open), point.linear(open + 1)],
    [0, 1, 1],
  );
}
