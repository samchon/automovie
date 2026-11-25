import { AutoMovieMotionInterval } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { linearMotionClock } from "../../internal/synthetic/linearMotionClock";

/** Rounding of one quotient and one quintic, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionInterval` reads progress over a window: `linear` is the
 * clamped uniform share, `progress` its minimum-jerk share `10u³ − 15u⁴ + 6u⁵`
 * (Flash and Hogan 1985), and `prepare` reads the same over a clock's named
 * window.
 *
 * Scenarios:
 *
 * 1. Over 1 to 3 s: 0 before, ¼ at 1.5 s, 1 after; the minimum-jerk share of ¼ is
 *    0.103515625.
 * 2. A window of no length steps at its close.
 * 3. A named window of a clock (`reach` at 0.5 s to `hold` at 2.5 s) reads the
 *    same as its seconds.
 */
export function test_motions_compose_motion_interval(): void {
  // 1. Uniform and minimum-jerk shares.
  TestValidator.predicate(
    "clamped uniform and minimum-jerk progress",
    AutoMovieMotionInterval.linear(1, 3, 0) === 0 &&
      nclose(AutoMovieMotionInterval.linear(1, 3, 1.5), 0.25, ROUNDING) &&
      AutoMovieMotionInterval.linear(1, 3, 4) === 1 &&
      nclose(
        AutoMovieMotionInterval.progress(1, 3, 1.5),
        0.103515625,
        ROUNDING,
      ),
  );

  // 2. A window of no length.
  TestValidator.predicate(
    "an empty window steps at its close",
    AutoMovieMotionInterval.linear(2, 2, 1.999) === 0 &&
      AutoMovieMotionInterval.linear(2, 2, 2) === 1,
  );

  // 3. A named window.
  const named: AutoMovieMotionInterval.IPrepared =
    AutoMovieMotionInterval.prepare(
      linearMotionClock(3, [
        { name: "reach", seconds: 0.5 },
        { name: "hold", seconds: 2.5 },
      ]),
      "reach",
      "hold",
    );
  TestValidator.predicate(
    "a named window reads its seconds",
    nclose(named.linear(1), 0.25, ROUNDING) &&
      nclose(named.progress(1), 0.103515625, ROUNDING),
  );
}
